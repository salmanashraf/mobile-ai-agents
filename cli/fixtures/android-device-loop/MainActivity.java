package dev.mobileai.demo;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.widget.*;

public class MainActivity extends Activity {
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    LinearLayout layout = new LinearLayout(this);
    layout.setOrientation(LinearLayout.VERTICAL);
    layout.setPadding(40, 100, 40, 40);
    layout.setBackgroundColor(Color.rgb(245, 248, 255));
    TextView title = new TextView(this);
    title.setText("Build a better daily habit");
    title.setTextSize(28);
    layout.addView(title);
    TextView instruction = new TextView(this);
    instruction.setText("Give your habit a name, then save it.");
    instruction.setTextSize(18);
    layout.addView(instruction);
    EditText input = new EditText(this);
    input.setHint("Habit name");
    input.setSingleLine(true);
    layout.addView(input);
    Button save = new Button(this);
    save.setText("Save habit");
    layout.addView(save);
    TextView result = new TextView(this);
    result.setTextSize(22);
    result.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
    layout.addView(result);
    save.setOnClickListener(new View.OnClickListener() {
      @Override public void onClick(View view) {
      String name = input.getText().toString().trim();
      // Deliberate demonstration defect: blank habits must be rejected.
      result.setText("Habit saved: " + name);
      }
    });
    setContentView(layout);
  }
}
